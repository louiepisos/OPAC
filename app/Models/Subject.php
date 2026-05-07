<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subject extends Model
{
    protected $primaryKey = 'subject_id';
    protected $fillable   = ['subject_name'];

    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_subjects', 'subject_id', 'book_id');
    }
}