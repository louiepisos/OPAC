<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Book::with(['authors','publisher','subjects','series'])
            ->withCount([
                'copies',
                'copies as available_copies_count' => fn($q) => $q->where('status','Available')
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
            Book::with(['authors','publisher','subjects','series','copies'])->findOrFail($id)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'title'            => 'required|string|max:500',
            'subtitle'         => 'nullable|string|max:500',
            'isbn'             => 'nullable|string|max:20|unique:books',
            'publisher_id'     => 'nullable|exists:publishers,publishers_id',
            'publication_year' => 'nullable|integer|min:1000|max:9999',
            'edition'          => 'nullable|string|max:50',
            'description'      => 'nullable|string',
            'language'         => 'nullable|string|max:50',
            'format'           => 'required|in:Print,Ebook,Audio',
            'author_ids'       => 'array',
            'author_ids.*'     => 'exists:authors,author_id',
            'subject_ids'      => 'array',
            'subject_ids.*'    => 'exists:subjects,subject_id',
            'series_ids'       => 'array',
            'series_ids.*'     => 'exists:series,series_id',
        ]);

        $book = Book::create($v);

        if (!empty($v['author_ids'])) {
            $pivot = collect($v['author_ids'])
                ->mapWithKeys(fn($id, $i) => [$id => ['author_order' => $i + 1]])->all();
            $book->authors()->sync($pivot);
        }
        $book->subjects()->sync($v['subject_ids'] ?? []);
        $book->series()->sync($v['series_ids'] ?? []);

        return response()->json($book->load(['authors','publisher','subjects','series']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $book = Book::findOrFail($id);
        $v = $request->validate([
            'title'            => 'sometimes|string|max:500',
            'subtitle'         => 'nullable|string|max:500',
            'isbn'             => "nullable|string|max:20|unique:books,isbn,{$id},book_id",
            'publisher_id'     => 'nullable|exists:publishers,publishers_id',
            'publication_year' => 'nullable|integer|min:1000|max:9999',
            'edition'          => 'nullable|string|max:50',
            'description'      => 'nullable|string',
            'language'         => 'nullable|string|max:50',
            'format'           => 'sometimes|in:Print,Ebook,Audio',
            'author_ids'       => 'array','author_ids.*' => 'exists:authors,author_id',
            'subject_ids'      => 'array','subject_ids.*'=> 'exists:subjects,subject_id',
            'series_ids'       => 'array','series_ids.*' => 'exists:series,series_id',
        ]);

        $book->update($v);
        if (isset($v['author_ids'])) {
            $pivot = collect($v['author_ids'])
                ->mapWithKeys(fn($id, $i) => [$id => ['author_order' => $i + 1]])->all();
            $book->authors()->sync($pivot);
        }
        if (isset($v['subject_ids'])) $book->subjects()->sync($v['subject_ids']);
        if (isset($v['series_ids']))  $book->series()->sync($v['series_ids']);

        return response()->json($book->load(['authors','publisher','subjects','series']));
    }

    public function destroy(int $id): JsonResponse
    {
        Book::findOrFail($id)->delete();
        return response()->json(['message' => 'Book deleted.']);
    }
}