// pages/_app.js
export default function App({ Component, pageProps }) {
   return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <Component {...pageProps} />
    </div>
  );
}