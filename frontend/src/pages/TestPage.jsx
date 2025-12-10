export default function TestPage() {
    return (
        <div style={{ padding: '20px', background: 'white', color: 'black' }}>
            <h1>Test Page - React is Working!</h1>
            <p>If you see this, React is rendering correctly.</p>
            <p>Time: {new Date().toLocaleString()}</p>
        </div>
    );
}
