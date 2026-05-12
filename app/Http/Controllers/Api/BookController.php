<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\Book;
use App\Models\Copy;
use App\Models\Publisher;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Book::with(['authors','publisher','subjects','series','copies'])
            ->withCount([
                'copies as total_copies_count',
                'copies as available_copies_count' => fn($q) => $q->where('status','Available'),
                'copies as borrowed_copies_count'  => fn($q) => $q->where('status','Checked Out'),
            ]);

        if ($s   = $request->query('q'))          $query->search($s);
        if ($f   = $request->query('format'))     $query->where('format', $f);
        if ($l   = $request->query('language'))   $query->where('language', $l);
        if ($sid = $request->query('subject_id'))
            $query->whereHas('subjects', fn($q) => $q->where('subject_id', $sid));
        if ($aid = $request->query('author_id'))
            $query->whereHas('authors', fn($q) => $q->where('author_id', $aid));
        if ($srid = $request->query('series_id'))
            $query->whereHas('series', fn($q) => $q->where('series_id', $srid));

        $sort = in_array($request->query('sort'), ['title','publication_year','created_at'])
            ? $request->query('sort') : 'title';
        $query->orderBy($sort, $request->query('dir') === 'desc' ? 'desc' : 'asc');

        return response()->json($query->paginate($request->query('per_page', 20)));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(
            $this->bookWithInventory($id)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge(['isbn' => $this->normalizeIsbn($request->input('isbn'))]);

        $v = $request->validate([
            'title'            => 'required|string|max:500',
            'subtitle'         => 'nullable|string|max:500',
            'isbn'             => 'nullable|string|max:20|unique:books,isbn',
            'publisher_id'     => 'nullable|exists:publishers,publishers_id',
            'publisher_name'   => 'nullable|string|max:255',
            'publication_year' => 'nullable|integer|min:1000|max:9999',
            'published_date'   => 'nullable|date',
            'edition'          => 'nullable|string|max:50',
            'description'      => 'nullable|string',
            'cover_image_url'  => 'nullable|string|max:1000',
            'language'         => 'nullable|string|max:50',
            'format'           => 'required|in:Print,Ebook,Audio',
            'shelf_location'   => 'nullable|string|max:255',
            'copy_count'       => 'nullable|integer|min:0|max:10000',
            'author_ids'       => 'array',
            'author_ids.*'     => 'exists:authors,author_id',
            'author_names'     => 'array',
            'author_names.*'   => 'string|max:255',
            'author_details'   => 'array',
            'author_details.*.name' => 'nullable|string|max:255',
            'author_details.*.birth_date' => 'nullable|date',
            'author_details.*.death_date' => 'nullable|date',
            'author_details.*.bio' => 'nullable|string|max:2000',
            'subject_ids'      => 'array',
            'subject_ids.*'    => 'exists:subjects,subject_id',
            'subject_names'    => 'array',
            'subject_names.*'  => 'string|max:255',
            'series_ids'       => 'array',
            'series_ids.*'     => 'exists:series,series_id',
        ]);
        $this->ensureUniqueNormalizedIsbn($v['isbn'] ?? null);

        $book = DB::transaction(function () use ($v) {
            $book = Book::create($this->bookPayload($v));
            $this->syncAuthors($book, $v);
            $this->syncSubjects($book, $v);
            $book->series()->sync($v['series_ids'] ?? []);
            $this->syncCopiesToTarget($book, array_key_exists('copy_count', $v) ? (int) $v['copy_count'] : 1, $v['shelf_location'] ?? null);

            return $book;
        });

        return response()->json($this->bookWithInventory($book->book_id), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $book = Book::findOrFail($id);
        if ($request->has('isbn')) {
            $request->merge(['isbn' => $this->normalizeIsbn($request->input('isbn'))]);
        }

        $v = $request->validate([
            'title'            => 'sometimes|string|max:500',
            'subtitle'         => 'nullable|string|max:500',
            'isbn'             => "nullable|string|max:20|unique:books,isbn,{$id},book_id",
            'publisher_id'     => 'nullable|exists:publishers,publishers_id',
            'publisher_name'   => 'nullable|string|max:255',
            'publication_year' => 'nullable|integer|min:1000|max:9999',
            'published_date'   => 'nullable|date',
            'edition'          => 'nullable|string|max:50',
            'description'      => 'nullable|string',
            'cover_image_url'  => 'nullable|string|max:1000',
            'language'         => 'nullable|string|max:50',
            'format'           => 'sometimes|in:Print,Ebook,Audio',
            'shelf_location'   => 'nullable|string|max:255',
            'copy_count'       => 'nullable|integer|min:0|max:10000',
            'author_ids'       => 'array','author_ids.*' => 'exists:authors,author_id',
            'author_names'     => 'array','author_names.*' => 'string|max:255',
            'author_details'   => 'array',
            'author_details.*.name' => 'nullable|string|max:255',
            'author_details.*.birth_date' => 'nullable|date',
            'author_details.*.death_date' => 'nullable|date',
            'author_details.*.bio' => 'nullable|string|max:2000',
            'subject_ids'      => 'array','subject_ids.*'=> 'exists:subjects,subject_id',
            'subject_names'    => 'array','subject_names.*'=> 'string|max:255',
            'series_ids'       => 'array','series_ids.*' => 'exists:series,series_id',
        ]);
        $this->ensureUniqueNormalizedIsbn($v['isbn'] ?? null, $book->book_id);

        DB::transaction(function () use ($book, $v) {
            $book->update($this->bookPayload($v));
            if (array_key_exists('author_ids', $v) || array_key_exists('author_names', $v) || array_key_exists('author_details', $v)) {
                $this->syncAuthors($book, $v);
            }
            if (array_key_exists('subject_ids', $v) || array_key_exists('subject_names', $v)) {
                $this->syncSubjects($book, $v);
            }
            if (isset($v['series_ids']))  $book->series()->sync($v['series_ids']);
            if (array_key_exists('copy_count', $v)) {
                $this->syncCopiesToTarget($book, (int) $v['copy_count'], $v['shelf_location'] ?? null);
            }
            if (array_key_exists('shelf_location', $v)) {
                $this->syncCopyLocation($book, $v['shelf_location']);
            }
        });

        return response()->json($this->bookWithInventory($book->book_id));
    }

    public function destroy(int $id): JsonResponse
    {
        Book::findOrFail($id)->delete();
        return response()->json(['message' => 'Book deleted.']);
    }

    public function manualPrintCopy(int $id): JsonResponse
    {
        $book = Book::findOrFail($id);
        $copy = $book->copies()
            ->where('status', 'Available')
            ->oldest('copy_id')
            ->first();

        if (!$copy) {
            throw ValidationException::withMessages([
                'copy' => 'This book has no available copies to decrease.',
            ]);
        }

        $copy->update(['status' => 'Checked Out']);

        return response()->json($this->bookWithInventory($book->book_id));
    }

    public function returnCopy(int $id): JsonResponse
    {
        $book = Book::findOrFail($id);
        $copy = $book->copies()
            ->where('status', 'Checked Out')
            ->oldest('updated_at')
            ->first();

        if (!$copy) {
            throw ValidationException::withMessages([
                'copy' => 'This book has no borrowed copies to return.',
            ]);
        }

        $copy->update(['status' => 'Available']);

        return response()->json($this->bookWithInventory($book->book_id));
    }

    private function bookWithInventory(int $id): Book
    {
        return Book::with(['authors','publisher','subjects','series','copies'])
            ->withCount([
                'copies as total_copies_count',
                'copies as available_copies_count' => fn($q) => $q->where('status','Available'),
                'copies as borrowed_copies_count'  => fn($q) => $q->where('status','Checked Out'),
            ])
            ->findOrFail($id);
    }

    private function bookPayload(array $data): array
    {
        $fields = [
            'title',
            'subtitle',
            'isbn',
            'publisher_id',
            'publication_year',
            'published_date',
            'edition',
            'description',
            'cover_image_url',
            'language',
            'format',
        ];

        $payload = [];
        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field] === '' ? null : $data[$field];
            }
        }

        if (array_key_exists('publisher_name', $data)) {
            $payload['publisher_id'] = $this->publisherIdFromName($data['publisher_name']);
        }

        return $payload;
    }

    private function syncAuthors(Book $book, array $data): void
    {
        $ids = collect($data['author_ids'] ?? [])
            ->filter()
            ->map(fn($id) => (int) $id);

        $details = collect($data['author_details'] ?? [])
            ->filter(fn($detail) => !empty($detail['name']))
            ->keyBy(fn($detail) => strtolower(trim($detail['name'])));

        $names = collect($data['author_names'] ?? [])
            ->map(fn($name) => trim((string) $name))
            ->filter();

        foreach ($details as $detail) {
            $names->push(trim($detail['name']));
        }

        foreach ($names->unique(fn($name) => strtolower($name))->values() as $name) {
            $name = trim($name);
            if ($name === '') {
                continue;
            }

            $detail = $details->get(strtolower($name), ['name' => $name]);
            $author = Author::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();
            if ($author) {
                $this->fillMissingAuthorDetails($author, $detail);
            } else {
                $author = Author::create($this->authorPayload($detail, $name));
            }

            $ids->push((int) $author->author_id);
        }

        $pivot = $ids->unique()->values()
            ->mapWithKeys(fn($authorId, $i) => [$authorId => ['author_order' => $i + 1]])
            ->all();

        $book->authors()->sync($pivot);
    }

    private function authorPayload(array $detail, string $fallbackName): array
    {
        return [
            'name' => trim($detail['name'] ?? $fallbackName),
            'birth_date' => $detail['birth_date'] ?? null,
            'death_date' => $detail['death_date'] ?? null,
            'bio' => $detail['bio'] ?? null,
            'author_type' => 'Personal',
        ];
    }

    private function fillMissingAuthorDetails(Author $author, array $detail): void
    {
        $payload = [];
        foreach (['birth_date', 'death_date', 'bio'] as $field) {
            if (empty($author->{$field}) && !empty($detail[$field])) {
                $payload[$field] = $detail[$field];
            }
        }

        if ($payload) {
            $author->update($payload);
        }
    }

    private function syncSubjects(Book $book, array $data): void
    {
        $ids = collect($data['subject_ids'] ?? [])
            ->filter()
            ->map(fn($id) => (int) $id);

        foreach ($data['subject_names'] ?? [] as $name) {
            $name = trim($name);
            if ($name === '') {
                continue;
            }
            $subject = Subject::whereRaw('LOWER(subject_name) = ?', [strtolower($name)])->first()
                ?: Subject::create(['subject_name' => $name]);
            $ids->push((int) $subject->subject_id);
        }

        $book->subjects()->sync($ids->unique()->values()->all());
    }

    private function syncCopiesToTarget(Book $book, int $target, ?string $location = null): void
    {
        $current = $book->copies()->count();
        if ($target > $current) {
            for ($i = 0; $i < $target - $current; $i++) {
                Copy::create(['book_id' => $book->book_id, 'status' => 'Available', 'location' => $location]);
            }
            if ($location !== null) {
                $this->syncCopyLocation($book, $location);
            }
            return;
        }

        if ($location !== null) {
            $this->syncCopyLocation($book, $location);
        }

        if ($target < $current) {
            $removeCount = $current - $target;
            $copies = $book->copies()
                ->where('status', 'Available')
                ->latest('copy_id')
                ->take($removeCount)
                ->get();

            if ($copies->count() < $removeCount) {
                throw ValidationException::withMessages([
                    'copy_count' => 'Copy count cannot be lower than borrowed or reference copies.',
                ]);
            }

            foreach ($copies as $copy) {
                $copy->delete();
            }
        }
    }

    private function syncCopyLocation(Book $book, ?string $location): void
    {
        $book->copies()->update(['location' => $location]);
    }

    private function publisherIdFromName(?string $name): ?int
    {
        $name = trim((string) $name);
        if ($name === '') {
            return null;
        }

        $publisher = Publisher::whereRaw('LOWER(name) = ?', [strtolower($name)])->first()
            ?: Publisher::create(['name' => $name]);

        return (int) $publisher->publishers_id;
    }

    private function normalizeIsbn($isbn): ?string
    {
        $isbn = preg_replace('/[^0-9Xx]/', '', (string) $isbn);
        $isbn = strtoupper($isbn);

        return $isbn === '' ? null : $isbn;
    }

    private function ensureUniqueNormalizedIsbn(?string $isbn, ?int $ignoreBookId = null): void
    {
        if (!$isbn) {
            return;
        }

        $query = Book::whereNotNull('isbn');
        if ($ignoreBookId) {
            $query->where('book_id', '!=', $ignoreBookId);
        }

        foreach ($query->get(['book_id', 'title', 'isbn']) as $book) {
            if ($this->normalizeIsbn($book->isbn) === $isbn) {
                throw ValidationException::withMessages([
                    'isbn' => 'This ISBN already exists on "' . $book->title . '".',
                ]);
            }
        }
    }
}
