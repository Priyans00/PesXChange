import { WithAuth } from "@/components/with-auth";
import { ProfileComponent } from "./profile-component";

export default function ProfilePage() {
  return (
    <WithAuth>
      <ProfileComponent />
    </WithAuth>
  );
}
