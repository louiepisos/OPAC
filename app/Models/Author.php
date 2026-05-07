<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Author extends Model
{
    protected $primaryKey = 'author_id';
    protected $fillable   = ['name', 'birth_date', 'death_date', 'author_type'];
    protected $casts      = ['birth_date' => 'date', 'death_date' => 'date'];

    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_authors', 'author_id', 'book_id')
                    ->withPivot('author_order')
                    ->orderByPivot('author_order');
    }
}