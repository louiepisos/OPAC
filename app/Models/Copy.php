<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Copy extends Model
{
    protected $primaryKey = 'copy_id';
    protected $fillable   = ['book_id', 'status', 'location'];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'book_id', 'book_id');
    }

    public function printTransactions(): HasMany
    {
        return $this->hasMany(PrintTransaction::class, 'copy_id', 'copy_id');
    }
}
