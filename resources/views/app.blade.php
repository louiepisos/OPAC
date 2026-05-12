<!DOCTYPE html>
<html lang="en" style="height:100%;margin:0;padding:0">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>OPAC</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; overflow: hidden; font-family: 'DM Sans', sans-serif; }
    #app { height: 100%; width: 100%; display: flex; flex-direction: column; }
  </style>
  @client
  @react
  @vite('resources/js/app.jsx')
</head>
<body>
  <div id="app"></div>
</body>
</html>