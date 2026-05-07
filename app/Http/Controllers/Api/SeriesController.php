<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Series;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeriesController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Series::withCount('books')->orderBy('series_name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(Series::create($request->validate([
            'series_name' => 'required|string|max:255|unique:series',
        ])), 201);
    }

    public function destroy(int $id): JsonResponse
    {
        Series::findOrFail($id)->delete();
        return response()->json(['message' => 'Series deleted.']);
    }
}