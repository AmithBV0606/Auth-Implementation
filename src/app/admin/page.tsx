import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="container 2xl:ml-[85px] mt-6">
      <Card className="p-6 ml-4 sm:ml-1 w-[60%] sm:w-[25%] h-36">
        <CardTitle>Admin</CardTitle>

        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
      </Card>
    </div>
  );
}
