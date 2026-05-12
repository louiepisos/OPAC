<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    protected $primaryKey = 'book_id';

    protected $fillable = [
        'title','subtitle','isbn','publisher_id',
        'publication_year','published_date','edition','description',
        'cover_image_url','language','format',
    ];

    protected $casts = [
        'publication_year' => 'integer',
        'published_date'   => 'date',
    ];

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class, 'publisher_id', 'publishers_id');
    }

    public function authors(): BelongsToMany
    {
        return $this->belongsToMany(Author::class, 'book_authors', 'book_id', 'author_id')
                    ->withPivot('author_order')
                    ->orderByPivot('author_order');
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'book_subjects', 'book_id', 'subject_id');
    }

    public function series(): BelongsToMany
    {
        return $this->belongsToMany(Series::class, 'book_series', 'book_id', 'series_id');
    }

    public function copies(): HasMany
    {
        return $this->hasMany(Copy::class, 'book_id', 'book_id');
    }

    public function printTransactions(): HasMany
    {
        return $this->hasMany(PrintTransaction::class, 'book_id', 'book_id');
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('subtitle', 'like', "%{$term}%")
              ->orWhere('isbn', 'like', "%{$term}%")
              ->orWhereHas('authors', fn($a) => $a->where('name', 'like', "%{$term}%"))
              ->orWhereHas('subjects', fn($s) => $s->where('subject_name', 'like', "%{$term}%"))
              ->orWhereHas('publisher', fn($p) => $p->where('name', 'like', "%{$term}%"));
        });
    }
}
