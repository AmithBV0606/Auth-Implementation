import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="container 2xl:ml-[75px] mt-6">
      <Card className="p-4 w-[15%]">
        <CardTitle>Admin</CardTitle>

        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
      </Card>
    </div>
  );
}
