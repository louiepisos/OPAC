@php
    $book = $transaction->book;
    $authors = $book->authors->pluck('name')->implode(', ') ?: 'N/A';
    $subjects = $book->subjects->pluck('subject_name')->take(3)->implode(', ') ?: 'N/A';
    $publisher = optional($book->publisher)->name ?: 'N/A';
    $printedAt = optional($transaction->printed_at)->format('m.d.y') ?: now()->format('m.d.y');
    $requester = $transaction->requester_name ?: optional($transaction->user)->name ?: 'Library User';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reference Assistance Slip {{ $transaction->slip_number }}</title>
    <style>
        @page { size: 74mm 105mm; margin: 0; }
        * { box-sizing: border-box; }
        html, body { width: 74mm; min-height: 105mm; margin: 0; background: #fff; }
        body { font-family: "Times New Roman", Times, serif; color: #111; }
        .slip {
            width: 74mm;
            min-height: 105mm;
            padding: 4mm;
            border: .35mm solid #111;
            position: relative;
        }
        .top-rule { border-top: .25mm solid #111; padding-top: 2.5mm; }
        .header { display: grid; grid-template-columns: 14mm 1fr 20mm; gap: 1.5mm; align-items: center; }
        .logo {
            width: 12mm; height: 10mm; border: .2mm solid #d7b34a; color: #b98b20;
            font: 700 6pt Arial, sans-serif; display: flex; align-items: center; justify-content: center;
            letter-spacing: .2mm;
        }
        .school { text-align: center; font: 700 5.5pt Arial, sans-serif; line-height: 1.2; }
        .campuses { font: 4.3pt Arial, sans-serif; font-weight: 400; margin-top: .8mm; }
        .doc { border-collapse: collapse; width: 100%; font: 4pt Arial, sans-serif; }
        .doc td { border: .15mm solid #111; padding: .45mm .55mm; line-height: 1.05; }
        .doc .blue { background: #11365d; color: #fff; font-weight: 700; }
        h1 { text-align: center; font-size: 9.5pt; margin: 5mm 0 2mm; letter-spacing: .1mm; }
        .box { border: .22mm solid #111; padding: 2.5mm 3mm; min-height: 59mm; }
        .prompt { font-size: 6.8pt; line-height: 1.25; margin-bottom: 2mm; }
        .checks { white-space: nowrap; }
        .field { display: grid; grid-template-columns: 19mm 1fr; gap: 1mm; align-items: end; margin: 2mm 0; }
        .label { font-size: 7.2pt; font-weight: 700; text-transform: uppercase; }
        .line {
            border-bottom: .18mm solid #111; min-height: 4.2mm; font-size: 6.8pt;
            overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding-left: .5mm;
        }
        .bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 4mm; }
        .sig-title { font-size: 7pt; font-weight: 700; text-transform: uppercase; margin-bottom: 1mm; }
        .sig-line { border-bottom: .18mm solid #111; height: 7mm; display: flex; align-items: end; justify-content: center; font-size: 6pt; overflow: hidden; }
        .sig-caption { font-size: 5.6pt; text-align: center; line-height: 1.1; }
        .date { margin-top: 2mm; display: grid; grid-template-columns: 8mm 1fr; gap: 1mm; font-size: 6pt; align-items: end; }
        .date div:last-child { border-bottom: .18mm solid #111; text-align: center; }
        .no-print { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); font: 13px Arial, sans-serif; }
        .no-print button { padding: 8px 14px; border: 0; border-radius: 6px; background: #0f2744; color: #fff; font-weight: 700; }
        @media print {
            .no-print { display: none; }
            .slip { border-width: .35mm; }
        }
    </style>
</head>
<body>
    <main class="slip">
        <div class="top-rule">
            <header class="header">
                <div class="logo">USTP</div>
                <div class="school">
                    UNIVERSITY OF SCIENCE AND TECHNOLOGY<br>
                    OF SOUTHERN PHILIPPINES
                    <div class="campuses">Alubijid | Balubal | Cagayan de Oro | Claveria | Jasaan | Oroquieta | Panaon | Villanueva</div>
                </div>
                <table class="doc">
                    <tr><td class="blue">Document Code No.</td></tr>
                    <tr><td><strong>FM-USTP-LIB-02</strong></td></tr>
                    <tr><td class="blue">Rev No. &nbsp;&nbsp; Effective Date &nbsp;&nbsp; Page No.</td></tr>
                    <tr><td>00 &nbsp;&nbsp;&nbsp;&nbsp; 03.17.25 &nbsp;&nbsp;&nbsp;&nbsp; 1 of 1</td></tr>
                </table>
            </header>
            <h1>REFERENCE ASSISTANCE SLIP</h1>
            <section class="box">
                <p class="prompt">
                    What type of library materials do you need?<br>
                    Please Check: <span class="checks">({{ strtolower($transaction->material_type) === 'book' ? '/' : ' ' }}) Book&nbsp;&nbsp; ( ) Periodicals&nbsp;&nbsp; ( ) Thesis/Dissertation&nbsp;&nbsp; ( ) Others: ____</span>
                </p>
                <div class="field"><div class="label">Author:</div><div class="line">{{ $authors }}</div></div>
                <div class="field"><div class="label">Title:</div><div class="line">{{ $book->title }}</div></div>
                <div class="field"><div class="label">Subject/Topic:</div><div class="line">{{ $subjects }}</div></div>
                <div class="field"><div class="label">Call Number:</div><div class="line">{{ $book->isbn ?: $transaction->slip_number }}</div></div>
                <div class="field"><div class="label">Location:</div><div class="line">{{ optional($transaction->copy)->location ?: $publisher }}</div></div>
            </section>
            <section class="bottom">
                <div>
                    <div class="sig-title">Library User</div>
                    <div class="sig-line">{{ $requester }}</div>
                    <div class="sig-caption">Signature Over-Printed Name<br>College/Department: {{ $transaction->course ?: '__________' }}</div>
                </div>
                <div>
                    <div class="sig-title">Library Staff In-Charge</div>
                    <div class="sig-line"></div>
                    <div class="sig-caption">Signature Over-Printed Name</div>
                    <div class="date"><div>Date:</div><div>{{ $printedAt }}</div></div>
                </div>
            </section>
        </div>
    </main>
    <div class="no-print"><button onclick="window.print()">Print slip</button></div>
    @if ($autoPrint)
        <script>
            window.addEventListener('load', function () {
                setTimeout(function () { window.print(); }, 250);
            });
        </script>
    @endif
</body>
</html>
