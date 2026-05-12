<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IsbnLookupController extends Controller
{
    public function show(string $isbn): JsonResponse
    {
        $originalIsbn = $isbn;
        $isbn = $this->normalizeIsbn($isbn);
        
        Log::info("ISBN lookup requested", ['original' => $originalIsbn, 'normalized' => $isbn]);
        
        if (!$isbn) {
            Log::warning("Invalid ISBN format", ['original' => $originalIsbn]);
            return response()->json(['message' => 'Enter a valid ISBN.'], 422);
        }

        $existing = $this->existingBookForIsbn($isbn);
        
        Log::info("Attempting to fetch book metadata from APIs", ['isbn' => $isbn]);
        $payload = $this->fromGoogleBooks($isbn) ?: $this->fromOpenLibrary($isbn);

        if (!$payload) {
            Log::warning("No book metadata found for ISBN", [
                'isbn' => $isbn,
                'google_books_attempted' => true,
                'open_library_attempted' => true
            ]);
            return response()->json([
                'message' => 'No book metadata was found for this ISBN.',
                'isbn' => $isbn,
                'duplicate' => (bool) $existing,
                'existing_book' => $existing,
            ], 404);
        }

        Log::info("Successfully retrieved book metadata", ['isbn' => $isbn, 'title' => $payload['title'] ?? 'unknown']);
        return response()->json([
            'isbn' => $isbn,
            'duplicate' => (bool) $existing,
            'existing_book' => $existing,
            'book' => $payload,
        ]);
    }

    private function fromGoogleBooks(string $isbn): ?array
    {
        try {
            Log::debug("Querying Google Books API", ['isbn' => $isbn]);
            $response = $this->safeGet('https://www.googleapis.com/books/v1/volumes', ['q' => 'isbn:' . $isbn], 8);
            
            if ($response->status() === 429) {
                Log::warning("Google Books API rate limited", ['isbn' => $isbn, 'status' => 429]);
                return null;
            }
            
            if (!$response->ok()) {
                Log::warning("Google Books API error", ['isbn' => $isbn, 'status' => $response->status()]);
                return null;
            }
            
            if (empty($response['items'][0]['volumeInfo'])) {
                Log::info("No results from Google Books API", ['isbn' => $isbn]);
                return null;
            }

            $info = $response['items'][0]['volumeInfo'];
            Log::info("Successfully retrieved data from Google Books API", ['isbn' => $isbn, 'title' => $info['title'] ?? 'unknown']);
            
            $publishedDate = $info['publishedDate'] ?? null;
            $authorNames = $info['authors'] ?? [];

            return [
                'title' => $info['title'] ?? '',
                'subtitle' => $info['subtitle'] ?? '',
                'isbn' => $isbn,
                'author_names' => $authorNames,
                'author_details' => $this->authorDetailsForNames($authorNames),
                'publisher_name' => $info['publisher'] ?? '',
                'published_date' => $this->normalizePublishedDate($publishedDate),
                'publication_year' => $this->yearFromDate($publishedDate),
                'description' => $info['description'] ?? '',
                'cover_image_url' => $this->httpsUrl($info['imageLinks']['thumbnail'] ?? $info['imageLinks']['smallThumbnail'] ?? ''),
                'subject_names' => $info['categories'] ?? [],
                'language' => strtoupper($info['language'] ?? ''),
            ];
        } catch (\Throwable $e) {
            Log::error("Exception in Google Books API call", [
                'isbn' => $isbn,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    private function fromOpenLibrary(string $isbn): ?array
    {
        try {
            Log::debug("Querying Open Library API", ['isbn' => $isbn]);
            $response = $this->safeGet("https://openlibrary.org/isbn/{$isbn}.json", [], 8);
            
            if (!$response->ok()) {
                Log::warning("Open Library API error", ['isbn' => $isbn, 'status' => $response->status()]);
                return null;
            }

            $data = $response->json();
            if (empty($data['title'])) {
                Log::info("No title found in Open Library response", ['isbn' => $isbn]);
                return null;
            }
            
            Log::info("Successfully retrieved data from Open Library API", ['isbn' => $isbn, 'title' => $data['title']]);

            $authorNames = [];
            $authorDetails = [];
            foreach (array_slice($data['authors'] ?? [], 0, 6) as $author) {
                if (empty($author['key'])) {
                    continue;
                }

                try {
                    $authorResponse = $this->safeGet('https://openlibrary.org' . $author['key'] . '.json', [], 4);
                } catch (\Throwable $e) {
                    continue;
                }

                if ($authorResponse->ok() && !empty($authorResponse['name'])) {
                    $authorNames[] = $authorResponse['name'];
                    $authorDetails[] = $this->authorDetailsFromOpenLibraryData($authorResponse->json());
                }
            }

            if (empty($authorNames) && !empty($data['by_statement'])) {
                $byStatement = trim((string) $data['by_statement']);
                if ($byStatement !== '') {
                    $authorNames[] = $byStatement;
                }
            }

            $publishedDate = $data['publish_date'] ?? null;
            $coverId = $data['covers'][0] ?? null;
            $coverImageUrl = $coverId
                ? "https://covers.openlibrary.org/b/id/{$coverId}-L.jpg"
                : "https://covers.openlibrary.org/b/isbn/{$isbn}-L.jpg";

            return [
                'title' => $data['title'] ?? '',
                'subtitle' => $data['subtitle'] ?? '',
                'isbn' => $isbn,
                'author_names' => $authorNames,
                'author_details' => array_values(array_filter($authorDetails)),
                'publisher_name' => $data['publishers'][0] ?? '',
                'published_date' => $this->normalizePublishedDate($publishedDate),
                'publication_year' => $this->yearFromDate($publishedDate),
                'description' => is_array($data['description'] ?? null)
                    ? ($data['description']['value'] ?? '')
                    : ($data['description'] ?? ''),
                'cover_image_url' => $coverImageUrl,
                'subject_names' => array_slice($data['subjects'] ?? [], 0, 8),
                'language' => '',
            ];
        } catch (\Throwable $e) {
            Log::error("Exception in Open Library API call", [
                'isbn' => $isbn,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    private function safeGet(string $url, array $query = [], int $timeout = 8)
    {
        try {
            return Http::timeout($timeout)
                ->acceptJson()
                ->withOptions(['allow_redirects' => true])
                ->get($url, $query);
        } catch (\Throwable $e) {
            if ($this->isCurlCertificateError($e)) {
                Log::warning('SSL certificate validation failed; retrying without verification', [
                    'url' => $url,
                    'timeout' => $timeout,
                    'exception' => $e->getMessage(),
                ]);

                return Http::timeout($timeout)
                    ->acceptJson()
                    ->withoutVerifying()
                    ->withOptions(['allow_redirects' => true])
                    ->get($url, $query);
            }

            throw $e;
        }
    }

    private function isCurlCertificateError(\Throwable $e): bool
    {
        $message = $e->getMessage();

        return strpos($message, 'cURL error 60') !== false
            || strpos($message, 'SSL certificate problem') !== false
            || strpos($message, 'unable to get local issuer certificate') !== false;
    }

    private function normalizeIsbn(string $isbn): ?string
    {
        $isbn = preg_replace('/[^0-9Xx]/', '', $isbn);
        $isbn = strtoupper($isbn);

        return $isbn === '' ? null : $isbn;
    }

    private function existingBookForIsbn(string $isbn): ?Book
    {
        foreach (Book::whereNotNull('isbn')->get(['book_id', 'title', 'isbn']) as $book) {
            if ($this->normalizeIsbn($book->isbn) === $isbn) {
                return $book;
            }
        }

        return null;
    }

    private function authorDetailsForNames(array $names): array
    {
        $details = [];

        foreach (array_slice($names, 0, 6) as $name) {
            $name = trim((string) $name);
            if ($name === '') {
                continue;
            }

            try {
                $search = $this->safeGet('https://openlibrary.org/search/authors.json', ['q' => $name], 4);
            } catch (\Throwable $e) {
                $details[] = ['name' => $name];
                continue;
            }

            $key = $search->ok() ? ($search['docs'][0]['key'] ?? null) : null;
            if (!$key) {
                $details[] = ['name' => $name];
                continue;
            }

            try {
                $author = $this->safeGet('https://openlibrary.org/authors/' . $key . '.json', [], 4);
            } catch (\Throwable $e) {
                $details[] = ['name' => $name];
                continue;
            }

            $details[] = $author->ok()
                ? array_merge($this->authorDetailsFromOpenLibraryData($author->json()), ['name' => $name])
                : ['name' => $name];
        }

        return $details;
    }

    private function authorDetailsFromOpenLibraryData(array $data): array
    {
        $bio = $data['bio'] ?? '';
        if (is_array($bio)) {
            $bio = $bio['value'] ?? '';
        }

        return array_filter([
            'name' => $data['name'] ?? '',
            'birth_date' => $this->normalizeAuthorDate($data['birth_date'] ?? null),
            'death_date' => $this->normalizeAuthorDate($data['death_date'] ?? null),
            'bio' => $this->shortText($bio),
        ], fn($value) => $value !== null && $value !== '');
    }

    private function normalizePublishedDate(?string $date): ?string
    {
        if (!$date) {
            return null;
        }

        if (preg_match('/^\d{4}$/', $date)) {
            return $date . '-01-01';
        }

        if (preg_match('/^\d{4}-\d{2}$/', $date)) {
            return $date . '-01';
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        if (preg_match('/(\d{4})/', $date, $matches)) {
            return $matches[1] . '-01-01';
        }

        return null;
    }

    private function normalizeAuthorDate(?string $date): ?string
    {
        if (!$date) {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        if (preg_match('/^\d{4}$/', $date)) {
            return $date . '-01-01';
        }

        $timestamp = strtotime($date);
        if ($timestamp !== false) {
            return date('Y-m-d', $timestamp);
        }

        if (preg_match('/(\d{4})/', $date, $matches)) {
            return $matches[1] . '-01-01';
        }

        return null;
    }

    private function yearFromDate(?string $date): ?int
    {
        if ($date && preg_match('/(\d{4})/', $date, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    private function httpsUrl(?string $url): string
    {
        if (!$url) {
            return '';
        }

        return preg_replace('/^http:/', 'https:', $url);
    }

    private function shortText(?string $text): string
    {
        $text = trim(strip_tags((string) $text));
        $text = preg_replace('/\s+/', ' ', $text);

        if (strlen($text) <= 700) {
            return $text;
        }

        return rtrim(substr($text, 0, 700)) . '...';
    }
}
