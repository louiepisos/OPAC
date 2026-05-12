<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->date('published_date')->nullable()->after('publication_year');
            $table->string('cover_image_url', 1000)->nullable()->after('description');
        });

        Schema::create('print_transactions', function (Blueprint $table) {
            $table->id('print_transaction_id');
            $table->unsignedBigInteger('book_id');
            $table->unsignedBigInteger('copy_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('slip_number', 40)->unique();
            $table->string('requester_name', 255)->nullable();
            $table->string('requester_email', 255)->nullable();
            $table->string('student_id', 100)->nullable();
            $table->string('course', 255)->nullable();
            $table->string('year', 50)->nullable();
            $table->string('material_type', 80)->default('Book');
            $table->timestamp('printed_at')->nullable();
            $table->timestamps();

            $table->foreign('book_id')
                ->references('book_id')->on('books')
                ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('copy_id')
                ->references('copy_id')->on('copies')
                ->onUpdate('cascade')->onDelete('set null');
            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onUpdate('cascade')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_transactions');

        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['published_date', 'cover_image_url']);
        });
    }
};
