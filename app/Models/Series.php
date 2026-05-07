<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Series extends Model
{
    protected $primaryKey = 'series_id';
    protected $fillable   = ['series_name'];

    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_series', 'series_id', 'book_id');
    }
}