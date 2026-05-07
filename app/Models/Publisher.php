<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Publisher extends Model
{
    protected $primaryKey = 'publishers_id';
    protected $fillable   = ['name', 'location'];

    public function books(): HasMany
    {
        return $this->hasMany(Book::class, 'publisher_id', 'publishers_id');
    }
}