import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { StakeholderService } from "../../services";
import { from, Observable } from "rxjs";
import { map, startWith, switchMap, tap } from "rxjs/operators";
import { ConstantHelper } from "src/app/constant/constantHelper";
import { SwalAlertSuccess } from "src/app/utility/sweetAlert";

interface StakeholderItem {
  uid: string;
  desc: string;
  isNew: boolean;
}

interface StakeholderForm {
  groupCode: string;
  searchCtrl: FormControl;
  inputCtrl: FormControl;
  isVisible: FormControl;
  dropdown: StakeholderItem[];
  display$: Observable<StakeholderItem[]>;
  isNewValid: any;
}

const IS_NEW_VALID = (form: StakeholderForm) => {
  let text = null;
  switch (typeof form.inputCtrl.value) {
    case "string":
      text = form.inputCtrl.value;
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
  newStakeHolder : string = "(new)";

  main: StakeholderForm = {
    groupCode: ConstantHelper.StakeholderStatus.Header,
    searchCtrl: new FormControl(""),
    inputCtrl: new FormControl(""),
    isVisible: new FormControl(false),
    dropdown: [] as StakeholderItem[],
    display$: new Observable(),
    isNewValid: IS_NEW_VALID,
  };

  sub: StakeholderForm = {
    groupCode: ConstantHelper.StakeholderStatus.Sub,
    searchCtrl: new FormControl(""),
    inputCtrl: new FormControl(""),
    isVisible: new FormControl(false),
    dropdown: [] as StakeholderItem[],
    display$: new Observable(),
    isNewValid: IS_NEW_VALID,
  };

  constructor(private service: StakeholderService) {}

  ngOnInit() {
    this.main.display$ = this.service.getHeader().pipe(
      tap((items: StakeholderItem[]) => {
        this.main.dropdown = items.map(m => {
          if (m.isNew) {
            m.desc = m.desc + " " + this.newStakeHolder;
          }
          return m;
        })
        if (this.mainControl.value) {
          var result = this.main.dropdown.find(m => m.uid === this.mainControl.value)
          this.main.searchCtrl.setValue(result);
        }
      }),
      switchMap(() => this.main.searchCtrl.valueChanges.pipe(
      startWith(""))),
      map((data: string | StakeholderItem) => {
        if (typeof data === "string")
          return this.filterStakeholder(data, this.main.dropdown);
        else 
          return this.filterStakeholder(data.desc, this.main.dropdown);
      }),
    );

    this.sub.display$ = this.service.getSub().pipe(
      tap((items: StakeholderItem[]) => {
        this.sub.dropdown = items.map(s => {
          if (s.isNew) {
            s.desc = s.desc + " " + this.newStakeHolder;
          }
          return s;
        })
        if (this.subControl.value) {
          var result = this.sub.dropdown.find(s => s.uid === this.subControl.value)
          this.sub.searchCtrl.setValue(result);
        }
      }),
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
  filterStakeholder(value: string ,items: StakeholderItem[]): StakeholderItem[] {
    const filterValue = value.toLowerCase();
    return items.filter(
      (a: StakeholderItem) => a.desc.toLowerCase().includes(filterValue)
    );
  }

  displayStakeholder(item: StakeholderItem): string | StakeholderItem {
    return item ? item.desc : item;
  }

  autoCompleteClosed(form: StakeholderForm) {
    if (typeof form.searchCtrl.value === "string") form.searchCtrl.setValue("");
    
    // console.log(this.main.searchCtrl.value);
    
    if (form.searchCtrl.value == "" && form.groupCode == ConstantHelper.StakeholderStatus.Header) 
      this.mainControl.setValue("")
     else if (form.searchCtrl.value == "" && form.groupCode == ConstantHelper.StakeholderStatus.Sub) 
      this.subControl.setValue("")
    
    // console.log("mainControl = " + this.mainControl.value);
    // console.log("subControl = " + this.subControl.value);
  }

  emptyIfNotMatch(form: StakeholderForm): void {
    if (typeof form.searchCtrl.value !== "string") return;

    if (!form.dropdown.some(({ desc }) => desc === form.searchCtrl.value)){
      form.searchCtrl.setValue("");
    }
  }
  // #endregion

  onSave(form: StakeholderForm) {
    var data = {
      groupCode: form.groupCode,
      description: form.inputCtrl.value,
    }
    this.service.create(data).subscribe((item: StakeholderItem) => {
      SwalAlertSuccess("บันทึกข้อมูลสำเร็จ");

      form.isVisible.setValue(false);
      form.inputCtrl.setValue('');

      if (form.groupCode == ConstantHelper.StakeholderStatus.Header) {
        this.service.getHeader().subscribe((res) => {
          form.dropdown = res.map(m => {
            if (m.isNew) {m.desc = m.desc + " " + this.newStakeHolder}
            return m;
          });
          var mains = form.dropdown.find(m => m.uid === item.uid);
          form.searchCtrl.setValue(mains);
        })
        this.mainControl.setValue(item.uid);
      } else {
        this.service.getSub().subscribe((res) => {
          form.dropdown = res.map(s => {
            if (s.isNew) {s.desc = s.desc + " " + this.newStakeHolder}
            return s;
          });
          var subs = form.dropdown.find(s => s.uid === item.uid);
          form.searchCtrl.setValue(subs);
        })
        this.subControl.setValue(item.uid)
      }
    });
  }

}
