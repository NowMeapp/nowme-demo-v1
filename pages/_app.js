// pages/_app.js
export default function App({ Component, pageProps }) {
   return (
    <div style={{ backgroundColor: "#9aaeb5", minHeight: "100vh" }}>
      <Component {...pageProps} />
    </div>
  );
}