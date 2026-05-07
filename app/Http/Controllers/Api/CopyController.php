<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Copy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CopyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Copy::with('book');
        if ($bid = $request->query('book_id')) $q->where('book_id', $bid);
        if ($st  = $request->query('status'))  $q->where('status', $st);
        return response()->json($q->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(Copy::create($request->validate([
            'book_id'  => 'required|exists:books,book_id',
            'status'   => 'required|in:Available,Checked Out,Reference',
            'location' => 'nullable|string|max:255',
        ])), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $c = Copy::findOrFail($id);
        $c->update($request->validate([
            'status'   => 'sometimes|in:Available,Checked Out,Reference',
            'location' => 'nullable|string|max:255',
        ]));
        return response()->json($c);
    }

    public function destroy(int $id): JsonResponse
    {
        Copy::findOrFail($id)->delete();
        return response()->json(['message' => 'Copy deleted.']);
    }
}