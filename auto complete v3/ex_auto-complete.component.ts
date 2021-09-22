import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormControl } from "@angular/forms";
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

const IS_NEW_VALID = (form: StakeholderForm) => {
  let text = null;
  switch (typeof form.searchCtrl.value) {
    case "string":
      text = form.inputCtrl.value;
      break;
    // default:
    //   text = (form.inputCtrl.value as StakeholderItem).desc;
    //   break;
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
    this.main.display$ = this.service.getHeader().pipe(
      tap((items: StakeholderItem[]) => (this.main.dropdown = items)),
      switchMap(() => this.main.searchCtrl.valueChanges.pipe(
      startWith(""))),
      map((data: string | StakeholderItem) => {
        if (!this.mainControl) {
          if (typeof data === "string")
            return this.filterStakeholder(data, this.main.dropdown);
          else 
            return this.filterStakeholder(data.desc, this.main.dropdown);
        } else {
          var result = this.main.dropdown.find(a => a.uid === this.mainControl.value)
          this.main.searchCtrl.setValue(result.desc);
          console.log(result);
          console.log(this.main.searchCtrl.value);
        }
      })
    );

    this.sub.display$ = this.service.getSub().pipe(
      tap((items: StakeholderItem[]) => (this.sub.dropdown = items)),
      switchMap(() => this.sub.searchCtrl.valueChanges.pipe(
      startWith(""))),
      map((data: string | StakeholderItem) => {
        if (!this.subControl) {
          if (typeof data === "string")
            return this.filterStakeholder(data, this.sub.dropdown);
          else 
            return this.filterStakeholder(data.desc, this.sub.dropdown);
        } else {
          var result = this.sub.dropdown.find(a => a.uid === this.subControl.value)
          this.sub.searchCtrl.setValue(result.desc);
        }
      })
    );

  }

  ngOnDestroy(): void {}

  // #region autocomplete 
  filterStakeholder(value: string,items: StakeholderItem[]): StakeholderItem[] {
    const filterValue = value.toLowerCase();
    return items.filter(
      (a: StakeholderItem) => a.desc.toLowerCase().indexOf(filterValue) === 0
    );
  }

  displayStakeholder(item: StakeholderItem): string | StakeholderItem {
    console.log(item)
    return item ? item.desc : item;
  }

  autoCompleteClosed(form: StakeholderForm) {
    if (typeof form.searchCtrl.value === "string") form.searchCtrl.setValue("");
  }

  emptyIfNotMatch(form: StakeholderForm): void {
    if (typeof form.searchCtrl.value !== "string") return;
    if (!form.dropdown.some(({ desc }) => desc === form.searchCtrl.value))
      form.searchCtrl.setValue("");
  }
  // #endregion

  onSave(form: StakeholderForm) {
    var data = {
      groupCode: form.groupCode,
      description: form.inputCtrl.value,
    };
    this.service.create(data).subscribe((item: StakeholderItem) => {
      SwalAlertSuccess("บันทึกข้อมูลสำเร็จ");
        form.dropdown.push(item);
        form.isVisible.setValue(false);
        form.inputCtrl.setValue('');
        form.searchCtrl.setValue(item);
        if (form.groupCode == ConstantHelper.StakeholderStatus.Header) {
          this.mainControl.setValue(item.uid);
        } else {
          this.subControl.setValue(item.uid)
        }
      // this.service.getHeader().subscribe(
      //   (res) => {
      //     // form.dropdown = res;
      //     form.dropdown.push(item);
      //     form.isVisible.setValue(false);
      //     form.inputCtrl.setValue('');
      //     form.searchCtrl.setValue(item);
      //     if (form.groupCode == ConstantHelper.StakeholderStatus.Header) this.mainControl.setValue(item.uid);
      //   }
      // )
      // this.service.getSub().subscribe(
      //   (res) => {
      //     // form.dropdown = res;
      //     form.dropdown.push(item);
      //     form.isVisible.setValue(false);
      //     form.inputCtrl.setValue('');
      //     form.searchCtrl.setValue(item);
      //     if (form.groupCode == ConstantHelper.StakeholderStatus.Sub) this.subControl.setValue(item.uid);
      //   }
      // )
    });
  }

}
