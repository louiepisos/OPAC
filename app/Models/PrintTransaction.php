<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintTransaction extends Model
{
    protected $primaryKey = 'print_transaction_id';

    protected $fillable = [
        'book_id',
        'copy_id',
        'user_id',
        'slip_number',
        'requester_name',
        'requester_email',
        'student_id',
        'course',
        'year',
        'material_type',
        'printed_at',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'book_id', 'book_id');
    }

    public function copy(): BelongsTo
    {
        return $this->belongsTo(Copy::class, 'copy_id', 'copy_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
