<?php
use App\Http\Controllers\Api\PrintSlipController;
use Illuminate\Support\Facades\Route;

Route::get('/print-slips/{id}', [PrintSlipController::class, 'show']);

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
