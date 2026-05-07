<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Subject::withCount('books')->orderBy('subject_name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(Subject::create($request->validate([
            'subject_name' => 'required|string|max:255|unique:subjects',
        ])), 201);
    }

    public function destroy(int $id): JsonResponse
    {
        Subject::findOrFail($id)->delete();
        return response()->json(['message' => 'Subject deleted.']);
    }
}