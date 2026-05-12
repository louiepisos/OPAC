<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::query();
        if ($s = $request->query('q')) {
            $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%");
        }
        return response()->json($q->orderBy('name')->paginate($request->query('per_page', 50)));
    }

    public function destroy(int $id): JsonResponse
    {
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'User deleted.']);
    }
}