import Page from "./[...filename]/page";
export default function Home() {
  // Richiama la pagina standard fingendo che ci troviamo su "/home"
  return <Page params={{ filename: ["home"] }} searchParams={{}} />;
}