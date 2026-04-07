import { Grid } from '@/components/Grid';

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;

  return (
    <main style={{ height: '100vh', display: 'flex' }}>
      <Grid roomId={roomId} />
    </main>
  );
}
