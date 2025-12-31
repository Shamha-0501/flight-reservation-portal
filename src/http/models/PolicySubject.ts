import { Model } from "@/forge/database/model";

export interface PolicySubjectAttr {
    id: number;
    policy_id: number;
    subject_type: string;
    subject_value: string;
};

export class PolicySubject extends Model<PolicySubjectAttr> implements PolicySubjectAttr {
    declare id: number;
    declare policy_id: number;
    declare subject_type: string;
    declare subject_value: string;
    
    protected static table = 'policy_subjects';
    protected static fillable = [
        'id',
        'policy_id',
        'subject_type',
        'subject_value'
    ];
}