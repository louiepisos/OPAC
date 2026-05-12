<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role'))       $table->string('role')->default('student')->after('email');
            if (!Schema::hasColumn('users', 'course'))     $table->string('course')->nullable()->after('role');
            if (!Schema::hasColumn('users', 'year'))       $table->string('year')->nullable()->after('course');
            if (!Schema::hasColumn('users', 'student_id')) $table->string('student_id')->nullable()->after('year');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role','course','year','student_id']);
        });
    }
};