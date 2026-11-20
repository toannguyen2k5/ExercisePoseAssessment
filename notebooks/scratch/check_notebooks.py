import seaborn; print('seaborn:', seaborn.__version__)
import matplotlib; print('matplotlib:', matplotlib.__version__)
import json

# Validate both notebooks are valid JSON
for nb_name in ['03_train_lstm.ipynb', '04_train_transformer.ipynb']:
    path = rf'd:\University_DUT\Semester7\Hoc_may_ung_dung\Project_CK\ExercisePoseAssessment\notebooks\{nb_name}'
    with open(path, encoding='utf-8-sig') as f:
        nb = json.load(f)
    print(f'{nb_name}: {len(nb["cells"])} cells — JSON OK')
