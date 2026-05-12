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
        @page { size: A6 landscape; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; background: #eef2f7; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 14px;
            font-family: "Times New Roman", Times, serif;
            color: #111;
        }
        .slip {
            width: 148mm;
            min-height: 105mm;
            padding: 4.5mm 5mm;
            background: #fff;
            border: .35mm solid #111;
            box-shadow: 0 16px 45px rgba(15, 39, 68, .18);
            position: relative;
        }
        .top-rule { border-top: .25mm solid #111; padding-top: 2.2mm; }
        .header {
            display: grid;
            grid-template-columns: 18mm 1fr 38mm;
            gap: 3mm;
            align-items: center;
        }
        .logo {
            width: 16mm;
            height: 13mm;
            border: .25mm solid #d7b34a;
            color: #b98b20;
            font: 700 8pt Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: .25mm;
        }
        .school {
            text-align: center;
            font: 700 8pt Arial, sans-serif;
            line-height: 1.18;
            letter-spacing: .1mm;
        }
        .campuses { font: 5.4pt Arial, sans-serif; font-weight: 400; margin-top: 1mm; letter-spacing: 0; }
        .doc { border-collapse: collapse; width: 100%; font: 5pt Arial, sans-serif; }
        .doc td { border: .15mm solid #111; padding: .65mm .8mm; line-height: 1.1; }
        .doc .blue { background: #11365d; color: #fff; font-weight: 700; }
        h1 {
            text-align: center;
            font-size: 13pt;
            margin: 4mm 0 2.5mm;
            letter-spacing: .25mm;
        }
        .box {
            border: .22mm solid #111;
            padding: 3mm 3.5mm;
            min-height: 43mm;
        }
        .prompt { font-size: 8pt; line-height: 1.28; margin: 0 0 2.4mm; }
        .checks { white-space: nowrap; }
        .fields {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 5mm;
            row-gap: 1.8mm;
        }
        .field { display: grid; grid-template-columns: 25mm 1fr; gap: 1.5mm; align-items: end; min-width: 0; }
        .field-wide { grid-column: 1 / -1; }
        .label { font-size: 8.3pt; font-weight: 700; text-transform: uppercase; }
        .line {
            border-bottom: .18mm solid #111;
            min-height: 5mm;
            font-size: 8pt;
            line-height: 1.2;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            padding: 0 .75mm .45mm;
        }
        .bottom {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12mm;
            margin-top: 4mm;
        }
        .sig-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; margin-bottom: 1mm; }
        .sig-line {
            border-bottom: .18mm solid #111;
            height: 7mm;
            display: flex;
            align-items: end;
            justify-content: center;
            font-size: 7.2pt;
            overflow: hidden;
            padding: 0 1mm .4mm;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .sig-caption { font-size: 6.3pt; text-align: center; line-height: 1.18; margin-top: .8mm; }
        .date { margin-top: 1.4mm; display: grid; grid-template-columns: 10mm 1fr; gap: 1mm; font-size: 6.8pt; align-items: end; }
        .date div:last-child { border-bottom: .18mm solid #111; text-align: center; }
        .no-print { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); font: 13px Arial, sans-serif; }
        .no-print button { padding: 9px 16px; border: 0; border-radius: 8px; background: #0f2744; color: #fff; font-weight: 700; box-shadow: 0 8px 18px rgba(15, 39, 68, .22); cursor: pointer; }
        @media print {
            html, body {
                width: 148mm;
                min-height: 105mm;
                background: #fff;
                display: block;
                padding: 0;
            }
            .slip {
                width: 148mm;
                min-height: 105mm;
                box-shadow: none;
                border-width: .35mm;
                page-break-after: avoid;
            }
            .no-print { display: none; }
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
                <div class="fields">
                    <div class="field"><div class="label">Author:</div><div class="line">{{ $authors }}</div></div>
                    <div class="field"><div class="label">Call Number:</div><div class="line">{{ $book->isbn ?: $transaction->slip_number }}</div></div>
                    <div class="field field-wide"><div class="label">Title:</div><div class="line">{{ $book->title }}</div></div>
                    <div class="field"><div class="label">Subject/Topic:</div><div class="line">{{ $subjects }}</div></div>
                    <div class="field"><div class="label">Location:</div><div class="line">{{ optional($transaction->copy)->location ?: $publisher }}</div></div>
                </div>
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
    <div class="no-print"><button onclick="window.print()">Print A6 landscape slip</button></div>
    @if ($autoPrint)
        <script>
            window.addEventListener('load', function () {
                setTimeout(function () { window.print(); }, 250);
            });
        </script>
    @endif
</body>
</html>
