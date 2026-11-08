import Link from "next/link";
import { SimplePage } from "@/components/SimplePage";

export default function NotFound() {
  return (
    <SimplePage title="This home is not on the map">
      <p>
        The page you are looking for moved or never existed. Check the address, or head back and search monthly stays and
        yearly leases.
      </p>
      <div>
        <Link href="/" className="btn-primary button-md">
          Back to home
        </Link>
      </div>
    </SimplePage>
  );
}
