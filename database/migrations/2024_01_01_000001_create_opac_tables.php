<?php

// PostgreSQL-compatible migration.
// publication_year uses smallInteger  (no YEAR type in PostgreSQL)
// enum() becomes VARCHAR + CHECK constraint via Laravel

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('authors', function (Blueprint $table) {
            $table->id('author_id');
            $table->string('name', 255);
            $table->date('birth_date')->nullable();
            $table->date('death_date')->nullable();
            $table->enum('author_type', ['Personal', 'Corporate'])->default('Personal');
            $table->timestamps();
        });

        Schema::create('publishers', function (Blueprint $table) {
            $table->id('publishers_id');
            $table->string('name', 255);
            $table->string('location', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->id('subject_id');
            $table->string('subject_name', 255);
            $table->timestamps();
        });

        Schema::create('series', function (Blueprint $table) {
            $table->id('series_id');
            $table->string('series_name', 255);
            $table->timestamps();
        });

        Schema::create('books', function (Blueprint $table) {
            $table->id('book_id');
            $table->string('title', 500);
            $table->string('subtitle', 500)->nullable();
            $table->string('isbn', 20)->nullable()->unique();
            $table->unsignedBigInteger('publisher_id')->nullable();
            $table->smallInteger('publication_year')->nullable();
            $table->string('edition', 50)->nullable();
            $table->text('description')->nullable();
            $table->string('language', 50)->nullable();
            $table->enum('format', ['Print', 'Ebook', 'Audio'])->default('Print');
            $table->timestamps();

            $table->foreign('publisher_id')
                  ->references('publishers_id')->on('publishers')
                  ->onUpdate('cascade')->onDelete('set null');
        });

        Schema::create('copies', function (Blueprint $table) {
            $table->id('copy_id');
            $table->unsignedBigInteger('book_id');
            $table->enum('status', ['Available', 'Checked Out', 'Reference'])->default('Available');
            $table->string('location', 255)->nullable();
            $table->timestamps();

            $table->foreign('book_id')
                  ->references('book_id')->on('books')
                  ->onUpdate('cascade')->onDelete('cascade');
        });

        Schema::create('book_authors', function (Blueprint $table) {
            $table->unsignedBigInteger('book_id');
            $table->unsignedBigInteger('author_id');
            $table->tinyInteger('author_order')->unsigned()->default(1);

            $table->primary(['book_id', 'author_id']);

            $table->foreign('book_id')
                  ->references('book_id')->on('books')
                  ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('author_id')
                  ->references('author_id')->on('authors')
                  ->onUpdate('cascade')->onDelete('cascade');
        });

        Schema::create('book_subjects', function (Blueprint $table) {
            $table->unsignedBigInteger('book_id');
            $table->unsignedBigInteger('subject_id');

            $table->primary(['book_id', 'subject_id']);

            $table->foreign('book_id')
                  ->references('book_id')->on('books')
                  ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('subject_id')
                  ->references('subject_id')->on('subjects')
                  ->onUpdate('cascade')->onDelete('cascade');
        });

        Schema::create('book_series', function (Blueprint $table) {
            $table->unsignedBigInteger('book_id');
            $table->unsignedBigInteger('series_id');

            $table->primary(['book_id', 'series_id']);

            $table->foreign('book_id')
                  ->references('book_id')->on('books')
                  ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('series_id')
                  ->references('series_id')->on('series')
                  ->onUpdate('cascade')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_series');
        Schema::dropIfExists('book_subjects');
        Schema::dropIfExists('book_authors');
        Schema::dropIfExists('copies');
        Schema::dropIfExists('books');
        Schema::dropIfExists('series');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('publishers');
        Schema::dropIfExists('authors');
    }
};
