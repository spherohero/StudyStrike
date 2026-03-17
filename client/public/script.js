function loadData() {
  fetch("/api/data")
    .then(res => res.json())
    .then(data => {
      document.getElementById("output").innerText =
        JSON.stringify(data, null, 2);
    });
}
