<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Author;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Author::withCount('books');
        if ($s = $request->query('q')) $q->where('name','like',"%{$s}%");
        return response()->json($q->orderBy('name')->paginate($request->query('per_page', 20)));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(Author::with('books.publisher')->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(Author::create($request->validate([
            'name'        => 'required|string|max:255',
            'birth_date'  => 'nullable|date',
            'death_date'  => 'nullable|date',
            'author_type' => 'required|in:Personal,Corporate',
            'bio'         => 'nullable|string|max:2000',
        ])), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $a = Author::findOrFail($id);
        $a->update($request->validate([
            'name'        => 'sometimes|string|max:255',
            'birth_date'  => 'nullable|date',
            'death_date'  => 'nullable|date',
            'author_type' => 'sometimes|in:Personal,Corporate',
            'bio'         => 'nullable|string|max:2000',
        ]));
        return response()->json($a);
    }

    public function destroy(int $id): JsonResponse
    {
        Author::findOrFail($id)->delete();
        return response()->json(['message' => 'Author deleted.']);
    }
}
