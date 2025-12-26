import ChatBubble from './ChatBubble';

export default function ChatBubbleTest() {
  const testMessages = [
    {
      sender: 'ai',
      text: 'Rumus ini $a=2$ dan $b=3$ harus terparse dengan baik'
    },
    {
      sender: 'ai',
      text: 'Ini tabel test:\n\n| Koefisien | Nilai |\n| :---: | :---: |\n| $a$ | 2 |\n| $b$ | 3 |\n| $c$ | -5 |'
    },
    {
      sender: 'ai',
      text: 'Persamaan kuadrat: $ax^2 + bx + c = 0$\n\nDengan nilai $a=2$, $b=3$, $c=-5$'
    }
  ];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Chat Bubble Test</h1>
      
      <div className="space-y-4 max-w-2xl">
        {testMessages.map((msg, idx) => (
          <div key={idx}>
            <ChatBubble sender={msg.sender} text={msg.text} />
          </div>
        ))}
      </div>
    </div>
  );
}
