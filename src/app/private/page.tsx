import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ToggleRoleButton } from "@/components/toggle-role-button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/auth/nextjs/currentUser";

export default async function PrivatePage() {
  const currentUser = await getCurrentUser();
  // const currentUser = { role: "user" };

  return (
    <div className="container mx-auto p-4 2xl:ml-[70px] mt-6 w-full">
      <Card className="p-6 w-[80%] sm:w-[50%] lg:w-[25%] h-52">
        <h1 className="text-4xl mb-8">Private: {currentUser?.role}</h1>

        <div className="flex gap-2">
          <ToggleRoleButton />

          <Button asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
