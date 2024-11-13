import Head from 'next/head';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>心理測驗</title>
        <meta name="description" content="心理測驗" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
    </>
  );
}