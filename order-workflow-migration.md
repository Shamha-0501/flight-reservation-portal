# Order workflow migration

Use this migration in the Laravel API repo to persist approval requests directly on the `orders` table.

## Columns to add

- `reschedule_request_status` nullable string
- `reschedule_requested_at` nullable timestamp
- `reschedule_reviewed_at` nullable timestamp
- `reschedule_reviewed_by` nullable unsigned big integer
- `reschedule_review_note` nullable text
- `reschedule_request_payload` nullable json
- `cancellation_request_status` nullable string
- `cancellation_requested_at` nullable timestamp
- `cancellation_reviewed_at` nullable timestamp
- `cancellation_reviewed_by` nullable unsigned big integer
- `cancellation_review_note` nullable text
- `cancellation_request_payload` nullable json

## Example Laravel migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('reschedule_request_status')->nullable()->index();
            $table->timestamp('reschedule_requested_at')->nullable();
            $table->timestamp('reschedule_reviewed_at')->nullable();
            $table->unsignedBigInteger('reschedule_reviewed_by')->nullable();
            $table->text('reschedule_review_note')->nullable();
            $table->json('reschedule_request_payload')->nullable();

            $table->string('cancellation_request_status')->nullable()->index();
            $table->timestamp('cancellation_requested_at')->nullable();
            $table->timestamp('cancellation_reviewed_at')->nullable();
            $table->unsignedBigInteger('cancellation_reviewed_by')->nullable();
            $table->text('cancellation_review_note')->nullable();
            $table->json('cancellation_request_payload')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'reschedule_request_status',
                'reschedule_requested_at',
                'reschedule_reviewed_at',
                'reschedule_reviewed_by',
                'reschedule_review_note',
                'reschedule_request_payload',
                'cancellation_request_status',
                'cancellation_requested_at',
                'cancellation_reviewed_at',
                'cancellation_reviewed_by',
                'cancellation_review_note',
                'cancellation_request_payload',
            ]);
        });
    }
};
```

## API behavior to mirror

- Customer submits a request.
- Tenant admin/owner approves or rejects the request.
- Customer-facing reschedule or cancellation action is enabled only after approval.
- Rejection should keep the order visible with a blocked message such as `Reschedule process not permitted for you`.
