<?php
use App\Http\Controllers\Api\AuthorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\CopyController;
use App\Http\Controllers\Api\IsbnLookupController;
use App\Http\Controllers\Api\PrintSlipController;
use App\Http\Controllers\Api\PublisherController;
use App\Http\Controllers\Api\SeriesController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login',    [AuthController::class, 'login']);
    Route::post('auth/register', [AuthController::class, 'register']);

    Route::get('isbn/{isbn}', [IsbnLookupController::class, 'show']);

    Route::apiResource('books',      BookController::class);
    Route::post('books/{id}/manual-print-copy', [BookController::class, 'manualPrintCopy']);
    Route::post('books/{id}/return-copy', [BookController::class, 'returnCopy']);
    Route::post('books/{id}/print-slip',  [PrintSlipController::class, 'store']);
    Route::apiResource('authors',    AuthorController::class);
    Route::apiResource('publishers', PublisherController::class);
    Route::get('print-transactions', [PrintSlipController::class, 'index']);

    Route::get   ('subjects',      [SubjectController::class, 'index']);
    Route::post  ('subjects',      [SubjectController::class, 'store']);
    Route::delete('subjects/{id}', [SubjectController::class, 'destroy']);

    Route::get   ('series',        [SeriesController::class, 'index']);
    Route::post  ('series',        [SeriesController::class, 'store']);
    Route::delete('series/{id}',   [SeriesController::class, 'destroy']);

    Route::get   ('copies',        [CopyController::class, 'index']);
    Route::post  ('copies',        [CopyController::class, 'store']);
    Route::patch ('copies/{id}',   [CopyController::class, 'update']);
    Route::delete('copies/{id}',   [CopyController::class, 'destroy']);

    Route::get   ('users',         [UserController::class, 'index']);
    Route::delete('users/{id}',    [UserController::class, 'destroy']);

    Route::get('stats', function () {
        return response()->json([
            'total_books'      => \App\Models\Book::count(),
            'total_authors'    => \App\Models\Author::count(),
            'total_users'      => \App\Models\User::count(),
            'total_copies'     => \App\Models\Copy::count(),
            'available_copies' => \App\Models\Copy::where('status','Available')->count(),
            'borrowed_copies'  => \App\Models\Copy::where('status','Checked Out')->count(),
            'printed_copies'   => \App\Models\Copy::where('status','Checked Out')->count(),
            'print_slips'      => \App\Models\PrintTransaction::count(),
            'formats'          => \App\Models\Book::selectRaw('format, count(*) as count')
                                    ->groupBy('format')->pluck('count','format'),
        ]);
    });
});
