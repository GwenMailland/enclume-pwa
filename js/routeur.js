// Routeur par hash : #/ · #/reglages · #/p/<id>/<onglet>/<…>
export function lireRoute() {
  const brut = location.hash.replace(/^#\/?/, "");
  const segments = brut
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  if (segments[0] === "p" && segments[1]) {
    return { ecran: "partie", pid: segments[1], onglet: segments[2] || "heros", reste: segments.slice(3) };
  }
  if (segments[0] === "reglages") return { ecran: "reglages", reste: [] };
  return { ecran: "accueil", reste: [] };
}

export function surChangement(rappel) {
  window.addEventListener("hashchange", rappel);
}
