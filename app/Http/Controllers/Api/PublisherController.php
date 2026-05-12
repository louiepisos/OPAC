<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublisherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Publisher::withCount('books');
        if ($s = $request->query('q')) $q->where('name','like',"%{$s}%");
        return response()->json($q->orderBy('name')->paginate($request->query('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(Publisher::create($request->validate([
            'name'     => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
        ])), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $p = Publisher::findOrFail($id);
        $p->update($request->validate([
            'name'     => 'sometimes|string|max:255',
            'location' => 'nullable|string|max:255',
        ]));
        return response()->json($p);
    }

    public function destroy(int $id): JsonResponse
    {
        Publisher::findOrFail($id)->delete();
        return response()->json(['message' => 'Publisher deleted.']);
    }
}
