import { WarehouseScene } from '../components/warehouse/WarehouseScene'
import { LoginForm } from '../components/form/LoginForm'

export function LoginPage() {
  return (
    <div className="login-robots">
      <WarehouseScene />
      <div className="lr-form-side">
        <LoginForm />
      </div>
    </div>
  )
}
