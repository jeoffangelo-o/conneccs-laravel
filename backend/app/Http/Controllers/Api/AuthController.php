<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users|regex:/^[^\s@]+@(cspc\.edu\.ph|my\.cspc\.edu\.ph)$/',
            'password' => 'required|string|min:8',
            'role' => 'required|in:FACULTY,SECRETARY,COORDINATOR,CHAIR,DEAN,VPAA',
        ], [
            'email.regex' => 'Only @cspc.edu.ph or @my.cspc.edu.ph email addresses are allowed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'first_name' => $request->firstName,
                'last_name' => $request->lastName,
                'name' => $request->firstName . ' ' . $request->lastName,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'name' => $user->name,
                    'role' => $user->role,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|regex:/^[^\s@]+@(cspc\.edu\.ph|my\.cspc\.edu\.ph)$/',
            'password' => 'required|string',
        ], [
            'email.regex' => 'Only @cspc.edu.ph or @my.cspc.edu.ph email addresses are allowed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Revoke all previous tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'name' => $user->name,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Google OAuth - Handle callback
     */
    public function googleAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|regex:/^[^\s@]+@(cspc\.edu\.ph|my\.cspc\.edu\.ph)$/',
            'firstName' => 'required|string',
            'lastName' => 'required|string',
            'googleId' => 'required|string',
            'picture' => 'nullable|string',
        ], [
            'email.regex' => 'Only @cspc.edu.ph or @my.cspc.edu.ph email addresses are allowed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if user exists
            $user = User::where('email', $request->email)->first();

            if ($user) {
                // Update Google ID if not set
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $request->googleId,
                        'profile_picture' => $request->picture,
                    ]);
                }
            } else {
                // Create new user
                $user = User::create([
                    'first_name' => $request->firstName,
                    'last_name' => $request->lastName,
                    'name' => $request->firstName . ' ' . $request->lastName,
                    'email' => $request->email,
                    'google_id' => $request->googleId,
                    'profile_picture' => $request->picture,
                    'role' => 'FACULTY', // Default role
                    'password' => Hash::make(uniqid()), // Random password for Google users
                ]);
            }

            // Revoke all previous tokens
            $user->tokens()->delete();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Google authentication successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'name' => $user->name,
                    'role' => $user->role,
                    'profilePicture' => $user->profile_picture,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            // Revoke the token that was used to authenticate the current request
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'name' => $user->name,
                'role' => $user->role,
                'profilePicture' => $user->profile_picture,
            ]
        ]);
    }
}
