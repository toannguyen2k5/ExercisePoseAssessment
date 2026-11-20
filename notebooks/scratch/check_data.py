import numpy as np, json, collections

d = r'd:\University_DUT\Semester7\Hoc_may_ung_dung\Project_CK\ExercisePoseAssessment\data\processed'

X_train = np.load(d+'/X_train.npy')
X_val   = np.load(d+'/X_val.npy')
X_test  = np.load(d+'/X_test.npy')
y_train = np.load(d+'/y_train.npy')
y_val   = np.load(d+'/y_val.npy')
y_test  = np.load(d+'/y_test.npy')

with open(d+'/label_map.json') as f:
    lmap = json.load(f)

names = {int(k): v for k, v in lmap.items()}

print('=== SHAPES ===')
print(f'X_train : {X_train.shape}  dtype={X_train.dtype}')
print(f'X_val   : {X_val.shape}')
print(f'X_test  : {X_test.shape}')
print(f'y_train : {y_train.shape}  unique={sorted(set(y_train.tolist()))}')

print('\n=== CLASS DISTRIBUTION ===')
for split, y in [('Train(aug)', y_train), ('Val', y_val), ('Test', y_test)]:
    dist = collections.Counter(y.tolist())
    total = sum(dist.values())
    line = '  '.join(f"{names[k]}:{dist[k]}" for k in sorted(dist))
    print(f'{split:12} ({total:>5}): {line}')

print('\n=== DATA QUALITY ===')
print(f'X_train mean  : {X_train.mean():.6f}  (should be ~0 after normalize)')
print(f'X_train std   : {X_train.std():.6f}  (should be ~1)')
print(f'X_train min   : {X_train.min():.4f}')
print(f'X_train max   : {X_train.max():.4f}')
print(f'NaN count     : {int(np.isnan(X_train).sum())}')
print(f'Inf count     : {int(np.isinf(X_train).sum())}')
print(f'Zero-seq count: {int((X_train.sum(axis=(1,2))==0).sum())}')

# Augmentation ratio check
raw_per_class = {k: 0 for k in names}
for yy in y_test:
    pass  # test is not augmented — use as reference
orig_total = len(y_test) / 0.20 * 0.80 * 0.80  # rough original train count
print(f'\nAug ratio     : {len(y_train) / max(1, orig_total):.1f}x (expected ~4x)')

