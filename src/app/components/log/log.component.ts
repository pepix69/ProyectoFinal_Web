import { Component, OnInit, ViewChild } from '@angular/core';
import { LogsService } from '../../services/logs.service';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Definir la interfaz para el gasto
interface Product {
  id: number,
  name: string,
  description: string
  price: number,
  stock: number,
  created_at: string
}

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
})
export class LogComponent implements OnInit {
  @ViewChild('logModal') logModal: any; // Referencia al modal
  listadoLogs: Product[] = []; // Lista de gastos
  loading = false; // Estado de carga
  logForm: FormGroup; // Formulario reactivo
  isEditMode = false; // Modo edición
  currentLogId: number | null = null; // ID actual del gasto

  constructor(
    private logsService: LogsService,
    public authService: AuthService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {
    // Inicializar formulario reactivo
    this.logForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      created_at: ['', [Validators.required]],
    });

  }


  ngOnInit() {
    this.cargarLogs(); // Cargar gastos al iniciar
  }

  cargarLogs() {
    if (this.authService.hasAuthority('READ')) {
      this.loading = true;
      this.logsService.getLogs().subscribe({
        next: (response) => {
          // Accede a la propiedad expenses
          this.listadoLogs = response.expenses || []; // Asigna un arreglo vacío si no hay datos
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar los gastos:', error);
          this.loading = false;
        },
      });
    }
  }
  


  createLog() {
    this.isEditMode = false;
    this.logForm.reset({
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
    });
    this.modalService.open(this.logModal, { backdrop: 'static', size: 'lg' });
  }

  editLog(expense: Product) {
    this.isEditMode = true;
    this.currentLogId = expense.id;
    this.logForm.patchValue({
      name: expense.name,
      description: expense.description,
      price: expense.price,
      stock: expense.stock,
      created_at: expense.created_at
    });
    this.modalService.open(this.logModal, { backdrop: 'static', size: 'lg' });
  }

  eliminarLog(expenseId: number) {
    if (this.authService.hasAuthority('DELETE')) {
      if (confirm('¿Está seguro que desea eliminar este gasto?')) {
        this.logsService.deleteLog(expenseId).subscribe({
          next: () => {
            this.cargarLogs();
          },
          error: (error) => {
            console.error('Error al eliminar el gasto:', error);
          },
        });
      }
    } else {
      alert('No tienes permiso para eliminar gastos.');
    }
  }

  onSubmitLog(modal: any) {
    if (this.logForm.invalid) {
      return;
    }

    const productData: Partial<Product> = {
      ...this.logForm.value,
      //amount: parseFloat(this.logForm.value.amount),
    };

    if (this.isEditMode && this.currentLogId) {
      if (!this.authService.hasAuthority('UPDATE')) {
        alert('No tienes permiso para actualizar gastos.');
        return;
      }
      this.logsService.updateLog(this.currentLogId, productData).subscribe({
        next: () => {
          modal.close();
          this.cargarLogs();
        },
        error: (err) => {
          console.error('Error al actualizar el producto:', err);
        },
      });
    } else {
      if (!this.authService.hasAuthority('CREATE')) {
        alert('No tienes permiso para crear productos.');
        return;
      }
      this.logsService.createLog(productData).subscribe({
        next: () => {
          modal.close();
          this.cargarLogs();
        },
        error: (err) => {
          console.error('Error al crear el producto:', err);
        },
      });
    }
  }
}
