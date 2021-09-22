import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { of, Subscription } from "rxjs";
import { StakeholderService } from "../../services";
import { Observable } from "rxjs";
import { map, startWith, switchMap, tap } from "rxjs/operators";
import { ConstantHelper } from "src/app/constant/constantHelper";
import { SwalAlertSuccess } from "src/app/utility/sweetAlert";

interface StakeholderItem {
  uid: string;
  desc: string;
}

interface StakeholderForm {
  groupCode: string;
  searchCtrl: FormControl;
  inputCtrl: FormControl;
  isVisible: FormControl;
  dropdown: StakeholderItem[];
  display$: Observable<StakeholderItem[]>;
  newValue: StakeholderItem;
  isNewValid: any;
}

// Check Valid ( ค่าซ้ำ ) 
const IS_NEW_VALID = (form: StakeholderForm) => {
  let text = null;
  switch (typeof form.searchCtrl.value) {
    case "string":
      text = form.inputCtrl.value;
      break;
    default:
      text = (form.inputCtrl.value as StakeholderItem).desc;
      break;
  }

  if (!text) return false;

  return !form.dropdown.some((a) => a.desc === text);
};

@Component({
  selector: "stakeholder-mainsub-selector",
  templateUrl: "./stakeholder-main-sub.component.html",
})
export class StakeholderComponent implements OnInit, OnDestroy {
  @Input() mainControl: FormControl;
  @Input() subControl: FormControl;

  main: StakeholderForm = {
    groupCode: ConstantHelper.StakeholderStatus.Header,
    searchCtrl: new FormControl(""),
    inputCtrl: new FormControl(""),
    isVisible: new FormControl(false),
    dropdown: [] as StakeholderItem[],
    display$: new Observable(),
    newValue: {} as StakeholderItem,
    isNewValid: IS_NEW_VALID,
  };

  sub: StakeholderForm = {
    groupCode: ConstantHelper.StakeholderStatus.Sub,
    searchCtrl: new FormControl(""),
    inputCtrl: new FormControl(""),
    isVisible: new FormControl(false),
    dropdown: [] as StakeholderItem[],
    display$: new Observable(),
    newValue: {} as StakeholderItem,
    isNewValid: IS_NEW_VALID,
  };

  constructor(private service: StakeholderService) {}

  ngOnInit() {
    // call service get Main and filter Main
    this.main.display$ = this.service.getHeader().pipe(
      tap((items: StakeholderItem[]) => (this.main.dropdown = items)),
      switchMap(() => this.main.searchCtrl.valueChanges.pipe(
      startWith(""))),
      map((data: string | StakeholderItem) => {
        if (typeof data === "string")
          return this.filterStakeholder(data, this.main.dropdown);
        else 
          return this.filterStakeholder(data.desc, this.main.dropdown);
      })
    );
    // call service get Sub and filter Sub
    this.sub.display$ = this.service.getSub().pipe(
      tap((items: StakeholderItem[]) => (this.sub.dropdown = items)),
      switchMap(() => this.sub.searchCtrl.valueChanges.pipe(
      startWith(""))),
      map((data: string | StakeholderItem) => {
        if (typeof data === "string")
          return this.filterStakeholder(data, this.sub.dropdown);
        else 
          return this.filterStakeholder(data.desc, this.sub.dropdown);
      })
    );
  }

  ngOnDestroy(): void {}

  // #region autocomplete

  //filter : 
  filterStakeholder(value: string,items: StakeholderItem[]): StakeholderItem[] {
    const filterValue = value.toLowerCase();
    return items.filter(
      (a: StakeholderItem) => a.desc.toLowerCase().indexOf(filterValue) === 0
    );
  }

  //display : result Main / Sub
  displayStakeholder(item: StakeholderItem): string | StakeholderItem {
    console.log(item)
    return item ? item.desc : item;
  }

  //check : when search data and delete data on dropdown => result == ' ' / null
  autoCompleteClosed(form: StakeholderForm) {
    if (typeof form.searchCtrl.value === "string") form.searchCtrl.setValue("");
  }

  //check 1 : เมื่อ พิมพ์เกิน / พิมพ์ขาด => เมื่อกดภายนอก auto complete default ค่าว่าง 
  //check 2 : เมื่อ พิมพ์ตรง => ค้างค่านั้นไว้ใน auto complete 
  emptyIfNotMatch(form: StakeholderForm): void {
    if (typeof form.searchCtrl.value !== "string") return;
    if (!form.dropdown.some(({ desc }) => desc === form.searchCtrl.value))
      form.searchCtrl.setValue("");
  }
  // #endregion

  // to save
  onSave(form: StakeholderForm) {
    var data = {
      groupCode: form.groupCode,
      description: form.inputCtrl.value,
    };
    console.log(data.description);
    console.log(data.groupCode);
    this.service.create(data).subscribe((item: StakeholderItem) => {
      SwalAlertSuccess("บันทึกข้อมูลสำเร็จ");
      // form.dropdown.push(item);
      // form.searchCtrl.setValue(item);
      // if (form.groupCode == ConstantHelper.StakeholderStatus.Header) {
      //   this.mainControl.setValue(item.uid);
      // } else {
      //   this.subControl.setValue(item.uid)
      // }
      this.service.getHeader().subscribe(
        (res) => {
          form.dropdown = res;
          // var mains = form.dropdown.find(m => m.uid === item.uid);
          form.dropdown.push(item);
          // form.searchCtrl.setValue(mains);
          this.mainControl.setValue(item.uid);
        }
      )
      this.service.getSub().subscribe(
        (res) => {
          form.dropdown = res;
          // var subs = form.dropdown.find(s => s.uid === item.uid);
          form.dropdown.push(item);
          // form.searchCtrl.setValue(subs);
          this.subControl.setValue(item.uid);
        }
      )
    });
  }

}
