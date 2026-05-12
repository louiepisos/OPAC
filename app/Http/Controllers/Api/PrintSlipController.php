<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Copy;
use App\Models\PrintTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PrintSlipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PrintTransaction::with(['book.authors', 'copy', 'user'])
            ->latest('printed_at')
            ->latest('print_transaction_id');

        if ($email = $request->query('requester_email')) {
            $query->where('requester_email', $email);
        }
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($term = trim((string) $request->query('q', ''))) {
            $query->where(function ($q) use ($term) {
                $q->where('slip_number', 'like', "%{$term}%")
                    ->orWhere('requester_name', 'like', "%{$term}%")
                    ->orWhere('requester_email', 'like', "%{$term}%")
                    ->orWhere('student_id', 'like', "%{$term}%")
                    ->orWhereHas('book', function ($bookQuery) use ($term) {
                        $bookQuery->where('title', 'like', "%{$term}%")
                            ->orWhere('isbn', 'like', "%{$term}%");
                    })
                    ->orWhereHas('copy', fn ($copyQuery) => $copyQuery->where('barcode', 'like', "%{$term}%"))
                    ->orWhereHas('user', function ($userQuery) use ($term) {
                        $userQuery->where('name', 'like', "%{$term}%")
                            ->orWhere('email', 'like', "%{$term}%");
                    });
            });
        }

        return response()->json($query->paginate($request->query('per_page', 20)));
    }

    public function store(Request $request, int $bookId): JsonResponse
    {
        $book = Book::with(['authors', 'publisher', 'subjects'])->findOrFail($bookId);

        $data = $request->validate([
            'user_id' => 'nullable|integer|exists:users,id',
            'requester_name' => 'nullable|string|max:255',
            'requester_email' => 'nullable|string|max:255',
            'student_id' => 'nullable|string|max:100',
            'course' => 'nullable|string|max:255',
            'year' => 'nullable|string|max:50',
            'material_type' => 'nullable|string|max:80',
        ]);

        $transaction = DB::transaction(function () use ($book, $data) {
            $copy = Copy::where('book_id', $book->book_id)
                ->where('status', 'Available')
                ->oldest('copy_id')
                ->first();

            if (!$copy) {
                throw ValidationException::withMessages([
                    'copy' => 'No available copies remain for this book.',
                ]);
            }

            $copy->update(['status' => 'Checked Out']);

            return PrintTransaction::create([
                'book_id' => $book->book_id,
                'copy_id' => $copy->copy_id,
                'user_id' => $data['user_id'] ?? null,
                'slip_number' => $this->slipNumber(),
                'requester_name' => $data['requester_name'] ?? null,
                'requester_email' => $data['requester_email'] ?? null,
                'student_id' => $data['student_id'] ?? null,
                'course' => $data['course'] ?? null,
                'year' => $data['year'] ?? null,
                'material_type' => $data['material_type'] ?? 'Book',
                'printed_at' => now(),
            ]);
        });

        $transaction->load(['book.authors', 'book.publisher', 'book.subjects', 'copy']);

        return response()->json([
            'message' => 'Reference assistance slip generated.',
            'print_url' => url('/print-slips/' . $transaction->print_transaction_id . '?auto=1'),
            'transaction' => $transaction,
            'book' => Book::with(['authors', 'publisher', 'subjects'])
                ->withCount([
                    'copies as total_copies_count',
                    'copies as available_copies_count' => fn($q) => $q->where('status','Available'),
                    'copies as borrowed_copies_count'  => fn($q) => $q->where('status','Checked Out'),
                ])
                ->findOrFail($book->book_id),
        ], 201);
    }

    public function show(int $id)
    {
        $transaction = PrintTransaction::with([
            'book.authors',
            'book.publisher',
            'book.subjects',
            'copy',
            'user',
        ])->findOrFail($id);

        return response()->view('print-slip', [
            'transaction' => $transaction,
            'autoPrint' => request()->has('auto'),
        ]);
    }

    private function slipNumber(): string
    {
        do {
            $number = 'RAS-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
        } while (PrintTransaction::where('slip_number', $number)->exists());

        return $number;
    }
}
