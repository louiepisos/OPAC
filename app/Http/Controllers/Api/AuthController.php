<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($request->email === config('opac.admin_email', 'admin@opac.com') &&
            $request->password === config('opac.admin_password', 'admin123')) {
            return response()->json([
                'role'  => 'admin',
                'name'  => 'Librarian Admin',
                'email' => $request->email,
            ]);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        return response()->json([
            'role'   => $user->role ?? 'student',
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'course' => $user->course ?? null,
            'year'   => $user->year   ?? null,
            'student_id' => $user->student_id ?? null,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|string|min:6',
            'student_id' => 'nullable|string',
            'course'     => 'nullable|string',
            'year'       => 'nullable|string',
        ]);

        $user = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => 'student',
            'course'     => $request->course,
            'year'       => $request->year,
            'student_id' => $request->student_id,
        ]);

        return response()->json([
            'role'   => 'student',
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'course' => $user->course,
            'year'   => $user->year,
            'student_id' => $user->student_id,
        ], 201);
    }
}
