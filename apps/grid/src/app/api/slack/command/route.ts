import { NextRequest, NextResponse } from 'next/server';
import { createRoom, roomExists } from '@/lib/store';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAX_RETRIES = 10;

function generateId(): string {
  let id = '';
  for (let i = 0; i < 3; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return id;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const userName = formData.get('user_name') as string;
  const userId = formData.get('user_id') as string;

  let roomId = generateId();
  let retries = 0;
  while (roomExists(roomId) && retries < MAX_RETRIES) {
    roomId = generateId();
    retries++;
  }

  createRoom(roomId, userId);

  const host = req.headers.get('host') || 'localhost:3030';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const boardUrl = `${protocol}://${host}/${roomId}?from=slack`;

  return NextResponse.json({
    response_type: 'in_channel',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${userName}* started a Grid voting session!\n<${boardUrl}|Join the board →>`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Room: \`${roomId}\` • Click the link to vote`,
          },
        ],
      },
    ],
  });
}
