import { useState } from 'react';

export default function TerminalLogin({ onUnlock }) {
    const [password, setPassword] = useState('');

    const handleUnlock = () => {
        // For now, any password works
        if (password.length > 0) {
            onUnlock();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && password.length > 0) {
            handleUnlock();
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-10 bg-[#0a0a0a] text-[#00ff41] font-['JetBrains_Mono',monospace] uppercase tracking-wider overflow-hidden relative select-none">
            {/* CRT Scanlines Effect */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-30"
                style={{
                    background: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                                linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`,
                    backgroundSize: '100% 4px, 3px 100%'
                }}
            />

            {/* CRT Flicker */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes flicker {
                    0% { opacity: 0.97; }
                    100% { opacity: 1; }
                }
                @keyframes blink {
                    from, to { opacity: 1; }
                    50% { opacity: 0; }
                }
                .crt-flicker {
                    animation: flicker 0.15s infinite;
                }
                .blinking-cursor {
                    display: inline-block;
                    width: 10px;
                    height: 1.2rem;
                    background-color: #00ff41;
                    margin-left: 8px;
                    vertical-align: middle;
                    animation: blink 1s step-end infinite;
                }
                .glow-text {
                    text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
                }
            `}} />

            <div className="crt-flicker relative z-10">
                {/* Header */}
                <header className="flex justify-between items-start mb-12 text-[10px] md:text-xs opacity-70">
                    <div className="space-y-1">
                        <p>SYSTEM: MYLIFE LIFEOS V4.0.2</p>
                        <p>KERNEL: LOCAL-FIRST-ENCRYPTION-ENGINE</p>
                        <p>STATUS: LOCKED_MEMORY_SECTOR_0x7F</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p>IP: 127.0.0.1 (LOCALHOST)</p>
                        <p>LATENCY: 0.2ms</p>
                        <p>DATE: {new Date().getFullYear()}.Q{Math.ceil((new Date().getMonth() + 1) / 3)}.SECURE</p>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto">
                    <div className="mb-10">
                        {/* ASCII Logo */}
                        <pre className="text-[8px] md:text-sm leading-tight glow-text font-bold mb-6 whitespace-pre">
                            {`███╗   ███╗██╗   ██╗██╗     ██╗███████╗███████╗
████╗ ████║╚██╗ ██╔╝██║     ██║██╔════╝██╔════╝
██╔████╔██║ ╚████╔╝ ██║     ██║█████╗  █████╗  
██║╚██╔╝██║  ╚██╔╝  ██║     ██║██╔══╝  ██╔══╝  
██║ ╚═╝ ██║   ██║   ███████╗██║██║     ███████╗
╚═╝     ╚═╝   ╚═╝   ╚══════╝╚═╝╚═╝     ╚══════╝`}
                        </pre>

                        <p className="text-sm md:text-base mb-2">INITIALIZING BOOT SEQUENCE...</p>
                        <div className="space-y-1 text-xs opacity-80 mb-8">
                            <p>[ <span className="text-white">OK</span> ] MOUNTING LOCAL_VAULT_SATA_01</p>
                            <p>[ <span className="text-white">OK</span> ] LOADING BIOMETRIC_HASH_RESERVE</p>
                            <p>[ <span className="text-white">OK</span> ] ENABLING AES-256-GCM HARDWARE ACCELERATION</p>
                            <p>[ <span className="text-white">OK</span> ] HANDSHAKE ESTABLISHED WITH PRIVACY_DAEMON</p>
                            <p className="mt-4 text-[#00ff41]">SECURITY WARNING: UNAUTHORIZED ACCESS TO THIS LIFE-INSTANCE IS LOGGED.</p>
                        </div>
                    </div>

                    {/* Password Input Section */}
                    <div className="flex-1 flex flex-col justify-end pb-12">
                        <div className="mb-4">
                            <p className="text-lg glow-text mb-4">ACCESS_PROTOCOL_REQUIRED</p>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold">ENTER PASSWORD:</span>
                                <div className="relative flex items-center">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        autoFocus
                                        maxLength={30}
                                        placeholder="Enter password..."
                                        className="bg-transparent border-none p-0 text-xl font-bold focus:ring-0 focus:outline-none w-[300px] text-[#00ff41] placeholder-[#003b00]"
                                    />
                                    <div className="blinking-cursor"></div>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col md:flex-row gap-6 mt-10">
                            <button
                                onClick={handleUnlock}
                                disabled={password.length === 0}
                                className="border border-[#003b00] px-6 py-2 hover:bg-[#00ff41] hover:text-[#0a0a0a] transition-colors duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span>🔓</span>
                                EXECUTE_UNLOCK
                            </button>
                            <button className="px-6 py-2 opacity-40 text-xs flex items-center gap-2 cursor-not-allowed">
                                <span>❓</span>
                                RECOVER_CREDENTIALS [DISABLED]
                            </button>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto border-t border-[#003b00] pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] gap-4">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse"></div>
                            <span>ENCRYPTION: ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#00ff41]"></div>
                            <span>LOCAL_SYNC: STABLE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#003b00]">
                        <span>🔒</span>
                        <p>MYLIFE LIFEOS - USERSPACE ENCRYPTED - END_OF_LINE</p>
                    </div>
                </footer>

                {/* RAM Dump Easter Egg */}
                <div className="fixed top-0 left-0 p-2 text-[8px] opacity-20 pointer-events-none select-none">
                    RAM_DUMP: 0xFFA01 0xBC002 0x44A12 0x00123 0x99281 0x01292 0xBB122 0xCC111 0xDD000 0xEE991 0x11223 0x44556 0x77889 0x00AA1 0xBBCC2
                </div>
            </div>
        </div>
    );
}
