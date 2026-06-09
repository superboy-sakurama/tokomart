export interface IDebt {
  id: string;
  tipe_transaksi: 'hutang' | 'piutang';
  jumlah: number;
  keterangan: string | null;
  status: 'lunas' | 'belum_lunas';
  jatuh_tempo: string;
  created_at: string;
  updated_at: string;
}
