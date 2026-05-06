import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-20 text-center">
      <div>
        <h1 className="text-3xl font-bold">ไม่พบอีเวนต์</h1>
        <p className="mt-3 text-muted-foreground">
          ลิงก์อาจหมดอายุหรือถูกลบไปแล้ว
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
